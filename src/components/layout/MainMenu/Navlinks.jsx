import React from 'react';
import { Link } from 'react-router-dom';

const Navlinks = () => {
  return (
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <Link className="nav-link" to="/dacs">
          Communities
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/campaigns">
          Campaigns
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/milestones">
          Milestones
        </Link>
      </li>
    </ul>
  );
};

export default Navlinks;
