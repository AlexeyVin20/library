export const navigationLinks = [
  {
    href: "/library",
    label: "Library",
  },

  {
    img: "/icons/user.svg",
    selectedImg: "/icons/user-fill.svg",
    href: "/my-profile",
    label: "My Profile",
  },
];

export const adminSideBarLinks = [
  {
    img: "/icons/admin/home.svg",
    route: "/admin",
    text: "Главная страница",
  },
  {
    img: "/icons/admin/user.png",
    route: "/admin/users",
    text: "Все пользователи",
  },
  {
    img: "/icons/admin/book.png",
    route: "/admin/books",
    text: "Все книги",
  },
  {
    img: "/icons/admin/shelf.png",
    route: "/admin/shelfs",
    text: "Полки",
  },
];

export const FIELD_NAMES = {
  fullName: "Full name",
  email: "Email",
  universityId: "University ID Number",
  password: "Password",
  universityCard: "Upload University ID Card",
};

export const FIELD_TYPES = {
  fullName: "text",
  email: "email",
  universityId: "number",
  password: "password",
};