const emailFormItemProps = {
  name: "email",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        const emailRegex =
          /^[\w!#$%&'*+/=?^`{|}~-]+(?:\.[\w!#$%&'*+/=?^`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+([A-Za-z]{2,4})$/;
        if (!value || value == "") {
          return Promise.reject("Enter email");
        }
        return emailRegex.test(value)
          ? Promise.resolve()
          : Promise.reject("Input a valid email");
      },
    },
  ],
};
const nameFormItemProps = {
  name: "name",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter name");
        }
        return Promise.resolve();
      },
    },
  ],
};
const phoneFormItemProps = {
  name: "phone",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter phone number");
        }
        return Promise.resolve();
      },
    },
  ],
};
const passwordFormItemProps = {
  name: "password",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter password");
        } else if (value.length < 6) {
          return Promise.reject("Password should be at least 6 digit");
        }
        return Promise.resolve();
      },
    },
  ],
};
const confirmPasswordFormItemProps = {
  name: "confirmPassword",
  dependencies: ["password"],
  rules: [
    ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
      validator(_: unknown, value: string) {
        if (!value || value == "") {
          return Promise.reject(new Error("Confirm your password"));
        }
        if (!(getFieldValue("password") === value)) {
          return Promise.reject(
            new Error("There is a password mismatch. Please reconfirm.")
          );
        }
        return Promise.resolve();
      },
    }),
  ],
};
const checkBoxFormItemProps = {
  name: "termsAgree",
  rules: [
    {
      validator: () => {
        const hasAgreed = document.querySelector(
          "#hasAgreed"
        ) as HTMLInputElement;
        if (!hasAgreed.checked) {
          return Promise.reject("Agree to the terms and conditions");
        }
        return Promise.resolve();
      },
    },
  ],
};
export {
  emailFormItemProps,
  checkBoxFormItemProps,
  nameFormItemProps,
  phoneFormItemProps,
  passwordFormItemProps,
  confirmPasswordFormItemProps,
};
