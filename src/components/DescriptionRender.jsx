import React from 'react';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';

const DescriptionRender = description => {
  return ReactHtmlParser(description, {
    transform(node, index) {
      if (node.attribs && node.attribs.class === 'ql-video') {
        const url = node.attribs.src;
        const match =
          url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtube\.com\/([a-zA-Z0-9_-]+)/) ||
          url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
          url.match(/^(https?):\/\/(?:(?:fame)\.)?giveth\.io\/([a-zA-Z0-9_-]+)/);
        if (match) {
          return (
            <div className="video-wrapper" key={index}>
              {convertNodeToElement(node, index)}
            </div>
          );
        }
        return (
          <video width="100%" height="auto" controls name="media">
            <source src={node.attribs.src} type="video/webm" />
          </video>
        );
      }
      if (node.name === 'img') {
        return (
          <img key="" style={{ height: 'auto', width: 'auto' }} alt="" src={node.attribs.src} />
        );
      }
      return undefined;
    },
  });
};

export default DescriptionRender;
