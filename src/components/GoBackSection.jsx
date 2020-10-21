import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import GoBackButton from './GoBackButton';
import { scrollToById } from '../lib/helpers';
import ShareOptions from './ShareOptions';

function GoBackSection(props) {
  const { backUrl, backButtonTitle, projectTitle, inPageLinks } = props;
  return (
    <div className="go-back-section container-fluid vertical-align mb-4">
      <GoBackButton to={backUrl} title={backButtonTitle} />
      <nav className="nav nav-center">
        {inPageLinks.map(({ title, inPageId }) => {
          return (
            <li className="nav-item" key={`${projectTitle}-${inPageId}`}>
              <NavLink className="nav-link mr-auto" to="#" onClick={() => scrollToById(inPageId)}>
                {title}
              </NavLink>
            </li>
          );
        })}
      </nav>
      <ShareOptions pageUrl={window.location.href} pageTitle={projectTitle} />
    </div>
  );
}

GoBackSection.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  backUrl: PropTypes.string.isRequired,
  backButtonTitle: PropTypes.string.isRequired,
  inPageLinks: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      inPageId: PropTypes.string.isRequired,
    }),
  ),
};

GoBackSection.defaultProps = {
  inPageLinks: [],
};

export default GoBackSection;
