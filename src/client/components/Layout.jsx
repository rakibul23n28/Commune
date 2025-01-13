// src/components/Layout.js
import Navbar from "./Navbar";
import Navbar2 from "./Navbar2";

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <div className="flex flex-col w-full">
        <Navbar2 />
        {children}
      </div>
    </div>
  );
};

export default Layout;
