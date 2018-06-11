/*eslint-env node, mocha */
import Adapter from "enzyme-adapter-react-16";

import Page from "./Page";
import Enzyme, { mount, shallow } from "enzyme";

Enzyme.configure({ adapter: new Adapter() });

describe("<Page />", () => {
  const props = {
    onClick: () => {},
    pageNumber: 1
  };

  it("renders an li", () => {
    const wrapper = shallow(<Page {...props} />);
    expect(wrapper.find("li")).to.have.length(1);
  });

  it("sets the active class if the page is active", () => {
    const wrapper = mount(<Page {...props} isActive={true} />);
    expect(wrapper.prop("isActive")).to.be.true;
    expect(wrapper.find("li").hasClass("active")).to.be.true;
  });

  it("sets the disabled class if the page is disabled", () => {
    const wrapper = mount(<Page {...props} isDisabled={true} />);
    expect(wrapper.prop("isDisabled")).to.be.true;
    expect(wrapper.find("li").hasClass("disabled")).to.be.true;
  });

  it("is not disabled by default", () => {
    const wrapper = mount(<Page {...props} />);
    expect(wrapper.prop("isDisabled")).to.be.false;
    expect(wrapper.find("li").hasClass("disabled")).to.be.false;
  });
	
  it("assigns a custom class to the list item", () => {
    const wrapper = mount(<Page {...props} itemClass="page-item" />);
    expect(wrapper.find("li").hasClass("page-item")).to.be.true;
  });

  it("assigns a link class to the link", () => {
    const wrapper = mount(<Page {...props} linkClass="page-link" />);
    expect(wrapper.find("a").hasClass("page-link")).to.be.true;
  });

  it("renders an element as a child if passed an one", () => {
    const child = <strong>1</strong>;
    const wrapper = mount(<Page {...props} pageText={child} />);
    expect(wrapper.html()).to.eql("<li class=\"\"><a class=\"\" href=\"#\"><strong>1</strong></a></li>");
  });
});
