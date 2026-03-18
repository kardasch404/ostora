import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStore } from "@/store";
import { LoginForm } from "@/components/auth/login-form";

jest.mock("@/services/auth.service", () => ({
  loginRequest: jest.fn(),
}));

describe("LoginForm component", () => {
  it("shows validation errors for invalid input", async () => {
    const user = userEvent.setup();
    const store = makeStore();

    render(
      <Provider store={store}>
        <LoginForm />
      </Provider>,
    );

    await user.type(screen.getByLabelText("Email"), "wrong-email");
    await user.type(screen.getByLabelText("Password"), "weak");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Please provide a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must contain at least 8 characters")).toBeInTheDocument();
  });
});
