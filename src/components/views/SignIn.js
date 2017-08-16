import React, {Component} from 'react'
import NewWallet from "../NewWallet";

/**
 SignIn Page
 **/

class SignIn extends Component {
  constructor() {
    super();

    this.state = {};

    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    // this.focusFirstInput();
  }

  focusFirstInput() {
    setTimeout(() => this.refs.password.element.focus(), 0)
  }

  mapInputs(inputs) {
    return {
      'password': inputs.password,
      'keystore': inputs.keystore,
    }
  }

  isValid() {
    return true;
  }

  submit(model) {
    const constructedModel = {
      title: model.title,
      description: model.description,
      image: this.state.image,
    }

  }

  render() {
    return (
      <div id="signin-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div>
              <h1>Register!</h1>

              <NewWallet walletCreated={this.props.handleWalletChange} />
              {/*<Form onSubmit={this.submit} mapping={this.mapInputs} layout='vertical'>*/}
              {/*<div className="form-group">*/}
              {/*<Input*/}
              {/*name="title"*/}
              {/*id="title-input"*/}
              {/*label="Title"*/}
              {/*ref="title"*/}
              {/*type="text"*/}
              {/*value={title}*/}
              {/*placeholder="E.g. Climate change."*/}
              {/*help="Describe your cause in 1 scentence."*/}
              {/*validations="minLength:10"*/}
              {/*validationErrors={{*/}
              {/*minLength: 'Please provide at least 10 characters.',*/}
              {/*}}*/}
              {/*required*/}
              {/*/>*/}
              {/*</div>*/}

              {/*<div className="form-group">*/}
              {/*<label>Add a picture</label>*/}
              {/*<File*/}
              {/*name="picture"*/}
              {/*onChange={() => this.loadAndPreviewImage()}*/}
              {/*ref="imagePreview"*/}
              {/*required*/}
              {/*/>*/}
              {/*</div>*/}

              {/*<button className="btn btn-success" formNoValidate={true} type="submit"*/}
              {/*disabled={isSaving || !this.isValid()}>*/}
              {/*{isSaving ? "Saving..." : "Save cause"}*/}
              {/*</button>*/}

              {/*</Form>*/}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SignIn;