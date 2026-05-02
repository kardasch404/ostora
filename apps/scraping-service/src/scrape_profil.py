#!/usr/bin/env python3
"""
LinkedIn Profile Scraper - Enhanced with Login, Session Management, and User Management
"""
import asyncio
import argparse
import json
import os
import random
import sys
import getpass
import urllib.request
from datetime import datetime
from playwright.async_api import async_playwright

class Logger:
    @staticmethod
    def log(level, msg):
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"\033[92m[{timestamp}]\033[0m \033[96m[{level}]\033[0m {msg}")
    
    @staticmethod
    def success(t): 
        Logger.log("SUCCESS", f"\033[92m✓ {t}\033[0m")
    
    @staticmethod
    def error(t): 
        Logger.log("ERROR", f"\033[91m✗ {t}\033[0m")
    
    @staticmethod
    def progress(t): 
        Logger.log("INFO", f"\033[96m▶ {t}\033[0m")
    
    @staticmethod
    def debug(t): 
        Logger.log("DEBUG", f"\033[93m→ {t}\033[0m")
    
    @staticmethod
    def scan(t): 
        Logger.log("SCAN", f"\033[95m◆ {t}\033[0m")
    
    @staticmethod
    def extract(t): 
        Logger.log("EXTRACT", f"\033[94m◈ {t}\033[0m")
    
    @staticmethod
    def info(t):
        Logger.log("INFO", f"\033[96mℹ {t}\033[0m")
    
    @staticmethod
    def warning(t):
        Logger.log("WARNING", f"\033[93m⚠ {t}\033[0m")
    
    @staticmethod
    def section(text):
        print(f"\n\033[1m\033[94m┌─ {text}\033[0m")
    
    @staticmethod
    def item(text):
        print(f"\033[94m│\033[0m {text}")
    
    @staticmethod
    def end_section():
        print(f"\033[94m└{'─'*68}\033[0m")

class UserManager:
    """Manage LinkedIn user accounts and credentials"""
    
    def __init__(self):
        self.users_file = "linkedin_users.json"
        self.users = self.load_users()
    
    def load_users(self):
        """Load users from file"""
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_users(self):
        """Save users to file"""
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def add_user(self, username, email, password):
        """Add new user"""
        if username in self.users:
            return False, "User already exists"
        
        self.users[username] = {
            'email': email,
            'password': password,
            'created': datetime.now().isoformat(),
            'last_used': None
        }
        self.save_users()
        return True, "User added successfully"
    
    def get_user(self, username):
        """Get user by username"""
        return self.users.get(username)
    
    def list_users(self):
        """List all users"""
        return list(self.users.keys())
    
    def update_last_used(self, username):
        """Update last used timestamp"""
        if username in self.users:
            self.users[username]['last_used'] = datetime.now().isoformat()
            self.save_users()
    
    def delete_user(self, username):
        """Delete user"""
        if username in self.users:
            del self.users[username]
            self.save_users()
            return True
        return False

class LinkedInProfileScraper:
    def __init__(self, interactive=True, auto_use_session=False, headless=False, fast_mode=False):
        self.l = Logger()
        self.user_manager = UserManager()
        self.interactive = interactive
        self.auto_use_session = auto_use_session
        self.headless = headless
        self.fast_mode = fast_mode
    
    def check_network(self):
        """Check internet connectivity"""
        try:
            urllib.request.urlopen('https://www.google.com', timeout=5)
            return True
        except:
            return False
    
    async def save_session(self, page, filename):
        """Save browser session to file"""
        cookies = await page.context.cookies()
        
        origins_data = []
        for origin in ["https://www.linkedin.com", "https://li.protechts.net"]:
            try:
                await page.goto(origin)
                local_storage = await page.evaluate("() => Object.entries(localStorage)")
                origins_data.append({
                    "origin": origin,
                    "localStorage": [{"name": k, "value": v} for k, v in local_storage]
                })
            except:
                pass
        
        session_data = {
            "cookies": cookies,
            "origins": origins_data
        }
        
        with open(filename, 'w') as f:
            json.dump(session_data, f, indent=2)
        self.l.success(f"Session saved to {filename}")
    
    async def load_session(self, page, filename):
        """Load browser session from file"""
        with open(filename, 'r') as f:
            session_data = json.load(f)
        
        await page.context.add_cookies(session_data['cookies'])
        
        for origin_data in session_data.get('origins', []):
            try:
                await page.goto(origin_data['origin'], timeout=30000, wait_until="domcontentloaded")
                for item in origin_data.get('localStorage', []):
                    await page.evaluate(f"localStorage.setItem('{item['name']}', '{item['value']}')")
            except:
                pass
        
        await page.goto("https://www.linkedin.com/feed", timeout=30000, wait_until="domcontentloaded")
        await asyncio.sleep(0.5 if self.fast_mode else 2)
        self.l.success("Session loaded successfully!")
    
    async def login(self, page):
        """Login to LinkedIn with session support and user management"""
        self.l.section("LinkedIn Login")
        
        # Check network
        if not self.check_network():
            self.l.error("No internet connection!")
            raise Exception("Network error")
        
        # Check for existing session
        session_file = "linkedin_session.json"
        if os.path.exists(session_file):
            self.l.info("Found existing session file")
            try:
                await self.load_session(page, session_file)
                self.l.end_section()
                return
            except Exception as e:
                self.l.warning(f"Failed to load session: {e}")
                self.l.info("Proceeding with manual login...")
                if not self.interactive:
                    raise Exception("Saved LinkedIn session is invalid. Please refresh linkedin_session.json.")
        elif not self.interactive:
            raise Exception("No linkedin_session.json found for non-interactive mode.")
        
        # Get credentials from user manager or manual input
        email = None
        password = None
        
        if self.interactive and self.user_manager.list_users():
            self.l.section("Select User")
            users = self.user_manager.list_users()
            for idx, username in enumerate(users, 1):
                user_data = self.user_manager.get_user(username)
                last_used = user_data.get('last_used', 'Never')
                self.l.item(f"{idx}. {username} ({user_data.get('email')}) - Last used: {last_used}")
            self.l.item(f"{len(users) + 1}. Add new user")
            self.l.end_section()
            
            choice = input(f"\033[96mSelect user (1-{len(users) + 1}):\033[0m ").strip()
            
            try:
                choice_idx = int(choice) - 1
                if 0 <= choice_idx < len(users):
                    selected_user = users[choice_idx]
                    user_data = self.user_manager.get_user(selected_user)
                    email = user_data.get('email')
                    password = user_data.get('password')
                    self.user_manager.update_last_used(selected_user)
                    self.l.success(f"Using account: {email}")
                elif choice_idx == len(users):
                    # Add new user
                    self.l.section("Add New User")
                    username = input(f"\033[96m│\033[0m Username: ").strip()
                    email = input(f"\033[96m│\033[0m Email: ").strip()
                    password = getpass.getpass(f"\033[96m│\033[0m Password: ")
                    success, msg = self.user_manager.add_user(username, email, password)
                    if success:
                        self.l.success(msg)
                    else:
                        self.l.error(msg)
                        raise Exception(msg)
                    self.l.end_section()
                else:
                    raise Exception("Invalid choice")
            except ValueError:
                self.l.error("Invalid input")
                raise
        
        # Manual login if no user manager or no users
        if not email or not password:
            if not self.interactive:
                raise Exception("No credentials available in non-interactive mode. Use saved session mode.")
            email = input(f"\033[96m│\033[0m Email: ")
            password = getpass.getpass(f"\033[96m│\033[0m Password: ")
        
        self.l.end_section()
        self.l.progress("Logging in...")
        
        try:
            self.l.info("[DEBUG] Step 1/6: Open login page")
            await page.goto("https://www.linkedin.com/login", timeout=30000, wait_until="domcontentloaded")
            await asyncio.sleep(0.3 if self.fast_mode else random.uniform(1, 2))
            
            self.l.info("[DEBUG] Step 2/6: Fill username")
            await page.fill("#username", email)
            await asyncio.sleep(0.3)
            
            self.l.info("[DEBUG] Step 3/6: Fill password")
            await page.fill("#password", password)
            
            await asyncio.sleep(0.2 if self.fast_mode else random.uniform(0.5, 1))
            self.l.info("[DEBUG] Step 4/6: Click submit")
            await page.click('button[type="submit"]')
            await asyncio.sleep(1 if self.fast_mode else 5)
            
            # Check for email verification
            if "checkpoint/challenge" in page.url:
                self.l.warning("Email verification required!")
                self.l.info("Waiting for you to complete verification in the browser...")
                self.l.info("Check your email for verification code and enter it in the browser window.")
                
                try:
                    await page.wait_for_url("**/feed/**", timeout=300000)
                    self.l.success("Verification completed!")
                except:
                    self.l.warning("Verification timeout - continuing anyway...")
                
                await asyncio.sleep(0.5 if self.fast_mode else 2)
            
            # Wait for feed
            try:
                self.l.info("[DEBUG] Step 5/6: Wait for /feed/")
                await page.wait_for_url("**/feed/**", timeout=12000 if self.fast_mode else 30000)
                self.l.success("Login successful!")
            except:
                self.l.warning("Waiting for manual completion...")
                self.l.info("[DEBUG] Step 6/6: Wait for /feed/ (manual fallback 120s)")
                await page.wait_for_url("**/feed/**", timeout=15000 if self.fast_mode else 120000)
                self.l.success("Login completed!")
            
            # Save session
            self.l.progress("Saving session...")
            await self.save_session(page, session_file)
            
        except Exception as e:
            self.l.error(f"Login error: {e}")
            raise
    
    async def extract_profile_info(self, p):
        self.l.extract("Extracting profile information...")
        profile = {}
        
        try:
            all_h2 = await p.locator('h2').all()
            for h2 in all_h2:
                text = await h2.text_content()
                if text and len(text.strip()) > 2 and len(text.strip()) < 100:
                    if 'notification' not in text.lower() and 'erfahrung' not in text.lower() and 'ausbildung' not in text.lower():
                        profile['name'] = text.strip()
                        self.l.success(f"Name: {text.strip()}")
                        break
        except Exception as e:
            self.l.debug(f"Name extraction error: {e}")
        
        try:
            all_p = await p.locator('p').all()
            for p_elem in all_p[:50]:
                text = await p_elem.text_content()
                if text and len(text.strip()) > 5 and len(text.strip()) < 200:
                    lower = text.lower()
                    if any(x in lower for x in ['entwickler', 'engineer', 'developer', 'manager', 'analyst']):
                        if 'notification' not in lower and 'kontakte' not in lower:
                            profile['title'] = text.strip()
                            self.l.success(f"Title: {text.strip()}")
                            break
        except Exception as e:
            self.l.debug(f"Title extraction error: {e}")
        
        try:
            all_p = await p.locator('p').all()
            for p_elem in all_p[:60]:
                text = await p_elem.text_content()
                if text and ',' in text and len(text.strip()) < 150:
                    if 'notification' not in text.lower() and 'kontakte' not in text.lower():
                        profile['location'] = text.strip()
                        self.l.success(f"Location: {text.strip()}")
                        break
        except Exception as e:
            self.l.debug(f"Location extraction error: {e}")
        
        return profile
    
    async def extract_experience(self, p):
        self.l.extract("Extracting experience section...")
        experiences = []
        
        try:
            h2_elements = await p.locator('h2').all()
            for h2 in h2_elements:
                text = await h2.text_content()
                if 'Erfahrung' in text or 'Experience' in text:
                    self.l.debug("Found Erfahrung h2!")
                    
                    section = await h2.locator('xpath=ancestor::section').first
                    divs = await section.locator('div').all()
                    self.l.debug(f"Found {len(divs)} divs in experience section")
                    
                    for div in divs:
                        try:
                            div_text = await div.text_content()
                            if any(x in div_text for x in ['Backend', 'Frontend', 'Full Stack', 'Developer', 'Engineer', 'Manager', 'Analyst', 'Entwickler']):
                                p_elems = await div.locator('p').all()
                                if len(p_elems) >= 2:
                                    exp_data = {}
                                    
                                    position = await p_elems[0].text_content()
                                    company = await p_elems[1].text_content()
                                    
                                    if position and len(position.strip()) > 2:
                                        exp_data['position'] = position.strip()
                                    if company and len(company.strip()) > 2 and company.strip() != position.strip():
                                        exp_data['company'] = company.strip()
                                    
                                    if exp_data and exp_data not in experiences:
                                        experiences.append(exp_data)
                                        self.l.success(f"Experience {len(experiences)}: {exp_data.get('position', 'Unknown')}")
                        except:
                            pass
                    break
            
            # Fallback: try details page
            if not experiences:
                self.l.debug("No experience found on main page, trying details page...")
                base_url = p.url.split('/details/')[0] if '/details/' in p.url else p.url.rstrip('/')
                await p.goto(f"{base_url}/details/experience/", timeout=30000, wait_until="domcontentloaded")
                await asyncio.sleep(0.5 if self.fast_mode else 2)
                
                all_p = await p.locator('p').all()
                for p_elem in all_p[:30]:
                    text = await p_elem.text_content()
                    if any(x in text for x in ['Backend', 'Frontend', 'Full Stack', 'Developer', 'Engineer', 'Manager']):
                        exp_data = {'position': text.strip()}
                        if exp_data not in experiences:
                            experiences.append(exp_data)
                            self.l.success(f"Experience {len(experiences)}: {text.strip()}")
        
        except Exception as e:
            self.l.debug(f"Experience extraction error: {e}")
        
        return experiences
    
    async def extract_education(self, p):
        self.l.extract("Extracting education section...")
        education = []
        
        try:
            h2_elements = await p.locator('h2').all()
            for h2 in h2_elements:
                text = await h2.text_content()
                if 'Ausbildung' in text or 'Education' in text:
                    self.l.debug("Found Ausbildung h2!")
                    
                    section = await h2.locator('xpath=ancestor::section').first
                    divs = await section.locator('div').all()
                    self.l.debug(f"Found {len(divs)} divs in education section")
                    
                    for div in divs:
                        try:
                            div_text = await div.text_content()
                            if any(x in div_text for x in ['UM6P', 'Université', 'University', 'Universität', 'Faculté', 'School', 'College', 'Institut']):
                                p_elems = await div.locator('p').all()
                                if len(p_elems) >= 1:
                                    edu_data = {}
                                    
                                    school = await p_elems[0].text_content()
                                    
                                    if school and len(school.strip()) > 2:
                                        edu_data['school'] = school.strip()
                                    
                                    if len(p_elems) > 1:
                                        degree = await p_elems[1].text_content()
                                        if degree and len(degree.strip()) > 2 and degree.strip() != school.strip():
                                            edu_data['degree'] = degree.strip()
                                    
                                    if edu_data and edu_data not in education:
                                        education.append(edu_data)
                                        self.l.success(f"Education {len(education)}: {edu_data.get('school', 'Unknown')}")
                        except:
                            pass
                    break
            
            # Fallback: try details page
            if not education:
                self.l.debug("No education found on main page, trying details page...")
                base_url = p.url.split('/details/')[0] if '/details/' in p.url else p.url.rstrip('/')
                await p.goto(f"{base_url}/details/education/", timeout=30000, wait_until="domcontentloaded")
                await asyncio.sleep(0.5 if self.fast_mode else 2)
                
                all_p = await p.locator('p').all()
                for p_elem in all_p[:30]:
                    text = await p_elem.text_content()
                    if any(x in text for x in ['University', 'Universität', 'School', 'College', 'Institut']):
                        edu_data = {'school': text.strip()}
                        if edu_data not in education:
                            education.append(edu_data)
                            self.l.success(f"Education {len(education)}: {text.strip()}")
        
        except Exception as e:
            self.l.debug(f"Education extraction error: {e}")
        
        return education
    
    async def scrape_profile(self, p, url):
        try:
            self.l.scan(f"Scraping profile: {url}")
            
            self.l.debug("Navigating to profile URL...")
            await p.goto(url, timeout=60000, wait_until="domcontentloaded")
            await asyncio.sleep(0.6 if self.fast_mode else random.uniform(4, 6))
            
            self.l.debug("Scrolling page to load all content...")
            scroll_steps = 3 if self.fast_mode else 10
            for i in range(scroll_steps):
                await p.evaluate("window.scrollBy(0, 800)")
                await asyncio.sleep(0.2 if self.fast_mode else 0.5)
            
            result = {
                'url': url,
                'profile': {},
                'experience': [],
                'education': []
            }
            
            result['profile'] = await self.extract_profile_info(p)
            result['experience'] = await self.extract_experience(p)
            result['education'] = await self.extract_education(p)
            
            self.l.success("Profile scraping completed")
            return result
        except Exception as e:
            self.l.error(f"Critical error during scraping: {e}")
            return {'url': url, 'error': str(e)}
    
    async def run(self, url):
        self.l.progress("=" * 70)
        self.l.progress("LinkedIn Profile Scraper v3.0 - Enhanced")
        self.l.progress("=" * 70)
        
        if not url.endswith('/'): 
            url += '/'
        
        self.l.debug(f"Target URL: {url}")
        
        async with async_playwright() as pw:
            self.l.progress("Launching browser...")
            br = await pw.chromium.launch(headless=self.headless)
            self.l.success("Browser launched")
            
            pg = await br.new_page()
            self.l.debug("New page created")
            
            try:
                await self.login(pg)
                self.l.progress("Starting profile extraction...")
                result = await self.scrape_profile(pg, url)
                
                self.l.debug("Closing browser...")
                await br.close()
                self.l.success("Browser closed")
                
                return result
            except Exception as e:
                self.l.error(f"Error: {e}")
                await br.close()
                return None

async def main():
    parser = argparse.ArgumentParser(description="LinkedIn profile scraper")
    parser.add_argument("url", nargs="?", help="LinkedIn profile URL")
    parser.add_argument("--json-only", action="store_true", help="Print only JSON output")
    parser.add_argument("--auto-session", action="store_true", help="Always use saved session when available")
    parser.add_argument("--non-interactive", action="store_true", help="Fail instead of prompting for input")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--fast", action="store_true", help="Use reduced waits for API-style extraction")

    args = parser.parse_args()

    if not args.url:
        print("Usage: python scrape_profil.py <linkedin_profile_url>")
        print("Example: python scrape_profil.py https://www.linkedin.com/in/zakaria-kardache/")
        sys.exit(1)

    url = args.url.strip()

    scraper = LinkedInProfileScraper(
        interactive=not args.non_interactive,
        auto_use_session=args.auto_session,
        headless=args.headless,
        fast_mode=args.fast,
    )
    result = await scraper.run(url)

    if not args.json_only:
        print("\n" + "=" * 70)
        print("JSON OUTPUT:")
        print("=" * 70)

    if result:
        if args.json_only:
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        payload = {"error": "Failed to scrape profile"}
        if args.json_only:
            print(json.dumps(payload))
        else:
            print(json.dumps(payload, indent=2))

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\033[91m✗ Interrupted by user\033[0m")
        sys.exit(0)
