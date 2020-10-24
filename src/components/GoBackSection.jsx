import React from 'react';
import PropTypes from 'prop-types';
import GoBackButton from './GoBackButton';
import { scrollToById } from '../lib/helpers';
import ShareOptions from './ShareOptions';

function GoBackSection(props) {
  const { backUrl, backButtonTitle, projectTitle, inPageLinks } = props;
  return (
    <div className="go-back-section container-fluid vertical-align mb-4">
      <GoBackButton to={backUrl} title={backButtonTitle} />
      <nav className="nav nav-center justify-content-center">
        {inPageLinks.map(({ title, inPageId }) => {
          return (
            <li className="nav-item" key={`${projectTitle}-${inPageId}`}>
              <button type="button" className="btn btn-link" onClick={() => scrollToById(inPageId)}>
                {title}
              </button>
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
