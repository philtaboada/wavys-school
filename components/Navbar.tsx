
import Image from "next/image";
import NavbarToggleButton from "./NavbarToggleButton";
import { ThemeSwitcher } from "./theme-switcher";
import UserMenu from "./UserMenu";
import RoleNavbar from "./RoleNavbar";
const Navbar = async () => {

  return (
    <div className="flex items-center justify-between p-4 bg-white">
      {/* TOGGLE BUTTON */}
      <div className="flex items-center">
        <NavbarToggleButton />

        {/* SEARCH BAR */}
        <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 ml-4">
          <Image src="/search.png" alt="" width={14} height={14} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-[200px] p-2 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* ICONS AND USER */}
      <div className="flex items-center gap-6">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative shadow-sm">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-lamaSky text-white rounded-full text-xs">
            1
          </div>
        </div>
        <RoleNavbar />
        {/*<RoleNavbar />*/}
        {/*<UserMenu />*/}
        <UserMenu />
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Navbar;
