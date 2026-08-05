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
const rcNumberFormItemProps = {
  name: "rc_number",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter RC number");
        }
        return Promise.resolve();
      },
    },
  ],
};
const contactPersonNameFormItemProps = {
  name: "contact_person_name",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter contact person name");
        }
        return Promise.resolve();
      },
    },
  ],
};
const contactPersonDesignationFormItemProps = {
  name: "contact_person_designation",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter contact person designation");
        }
        return Promise.resolve();
      },
    },
  ],
};
const contactPersonPhoneFormItemProps = {
  name: "contact_person_phone",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter contact person phone number");
        }
        return Promise.resolve();
      },
    },
  ],
};
const contactPersonEmailFormItemProps = {
  name: "contact_person_email",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        const emailRegex =
          /^[\w!#$%&'*+/=?^`{|}~-]+(?:\.[\w!#$%&'*+/=?^`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+([A-Za-z]{2,4})$/;
        if (!value || value == "") {
          return Promise.reject("Enter contact person email");
        }
        return emailRegex.test(value)
          ? Promise.resolve()
          : Promise.reject("Input a valid email");
      },
    },
  ],
};
const bvnFormItemProps = {
  name: "bvn",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter BVN");
        } else if (!/^\d{11}$/.test(value)) {
          return Promise.reject("BVN must be exactly 11 digits");
        }
        return Promise.resolve();
      },
    },
  ],
};
const ninFormItemProps = {
  name: "nin",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Enter NIN");
        } else if (!/^\d{11}$/.test(value)) {
          return Promise.reject("NIN must be exactly 11 digits");
        }
        return Promise.resolve();
      },
    },
  ],
};
const partnerTypeFormItemProps = {
  name: "partner_type",
  rules: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || value == "") {
          return Promise.reject("Select partner type");
        }
        return Promise.resolve();
      },
    },
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
  rcNumberFormItemProps,
  contactPersonNameFormItemProps,
  contactPersonDesignationFormItemProps,
  contactPersonPhoneFormItemProps,
  contactPersonEmailFormItemProps,
  bvnFormItemProps,
  ninFormItemProps,
  partnerTypeFormItemProps,
};
