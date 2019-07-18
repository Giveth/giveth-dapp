import React from 'react';
import PropTypes from 'prop-types';
import {
  FacebookShareButton,
  TwitterShareButton,
  TelegramShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  TelegramIcon,
  LinkedinIcon,
} from 'react-share';

const ShareOptions = props => {
  const { pageUrl, pageTitle } = props;
  return (
    <div className="share-options">
      <FacebookShareButton url={pageUrl} quote={pageTitle}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>

      <TwitterShareButton url={pageUrl} title={pageTitle}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>

      <TelegramShareButton url={pageUrl} title={pageTitle}>
        <TelegramIcon size={32} round />
      </TelegramShareButton>

      <LinkedinShareButton url={pageUrl} windowWidth={750} windowHeight={600}>
        <LinkedinIcon size={32} round />
      </LinkedinShareButton>
    </div>
  );
};

ShareOptions.propTypes = {
  pageUrl: PropTypes.string.isRequired,
  pageTitle: PropTypes.string.isRequired,
};

export default ShareOptions;
