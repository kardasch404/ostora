import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStore } from "@/store";
import { LoginForm } from "@/components/auth/login-form";
import { loginRequest } from "@/services/auth.service";

jest.mock("@/services/auth.service", () => ({
  loginRequest: jest.fn(),
}));

describe("Auth functional flow", () => {
  it("authenticates user and updates global state", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const store = makeStore();

    (loginRequest as jest.Mock).mockResolvedValue({
      accessToken: "token-value",
      role: "USER",
      user: {
        id: "u-1",
        email: "user@ostora.com",
        name: "Ostora User",
        role: "USER",
      },
    });

    render(
      <Provider store={store}>
        <LoginForm onSuccess={onSuccess} />
      </Provider>,
    );

    await user.type(screen.getByLabelText("Email"), "user@ostora.com");
    await user.type(screen.getByLabelText("Password"), "User12345!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith("USER");
  });
});
