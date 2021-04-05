import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';

const LeftMenu = () => {
  const [selectedKeys, setSelectedKeys] = useState();
  const SubMenu = Menu.SubMenu;
  const MenuItemGroup = Menu.ItemGroup;
  const handleClick = e => {
    setSelectedKeys(e.key);
  };

  return (
    <Menu mode="horizontal">
      <Menu.Item key="mail">
        <a href="">Home</a>
      </Menu.Item>
      <SubMenu title={<span>Blogs</span>}>
        <MenuItemGroup title="Item 1">
          <Menu.Item key="setting:1">Option 1</Menu.Item>
          <Menu.Item key="setting:2">Option 2</Menu.Item>
        </MenuItemGroup>
        <MenuItemGroup title="Item 2">
          <Menu.Item key="setting:3">Option 3</Menu.Item>
          <Menu.Item key="setting:4">Option 4</Menu.Item>
        </MenuItemGroup>
      </SubMenu>
      <Menu.Item key="alipay">
        <a href="">Contact Us</a>
      </Menu.Item>
    </Menu>
    // <Menu
    //   onClick={handleClick}
    //   selectedKeys={[selectedKeys]}
    //   // className="d-flex"
    //   mode="horizontal"
    // >
    //   <Menu.Item key="logo" className="ml-4">
    //     <Link to="/">
    //       <img
    //         src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
    //         width="70px"
    //         alt="Giveth logo"
    //       />
    //     </Link>
    //   </Menu.Item>
    //
    //   <Menu.Item key="Communities">
    //     <Link to="/dacs">Communities</Link>
    //   </Menu.Item>
    //   <Menu.Item key="Campaigns">
    //     <Link to="/campaigns">Campaigns</Link>
    //   </Menu.Item>
    //   <Menu.Item key="Milestones">
    //     <Link to="/milestones">Milestones</Link>
    //   </Menu.Item>
    // </Menu>
  );
};

export default LeftMenu;

LeftMenu.propTypes = {};

LeftMenu.defaultProps = {};
