import React, { Fragment } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import axios from 'axios';
import store from '../redux/store';
// import Posts from '../redux/sampleComponents/Posts';
// import PostForm from '../redux/sampleComponents/PostForm';

// this is master
class ChefAuth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      username: '',
      password: '',
      signup: false,
      redirect: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sendLogin = this.sendLogin.bind(this);
    this.sendSignup = this.sendSignup.bind(this);
  }

  setLogin() {
    this.setState({
      signup: false,
    });
  }

  setSignup() {
    this.setState({
      signup: true,
    });
  }

  sendLogin() {
    const { username, password } = this.state;
    axios.post('/login', {
      username,
      password,
    }).then((res) => {
      console.log('response from login is', res);
      const { data: { chefId } } = res;
      this.setState({
        redirect: true,
        chefId,
      });
    }).catch(err => console.log(err));
  }

  sendSignup() {
    const {
      username,
      password,
      name,
      email,
    } = this.state;
    axios.post('/signup', {
      username,
      password,
      name,
      email,
    }).then((res) => {
      console.log('response from signup is', res);
      const { data: { chefId } } = res;
      this.setState({
        redirect: true,
        chefId,
      });
    }).catch(err => console.log(err));
  }

  handleChange(e) {
    const { name } = e.target;
    const { value } = e.target;
    this.setState({
      [name]: value,
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const { signup } = this.state;
    return signup ? this.sendSignup() : this.sendLogin();
  }

  renderRedirect() {
    const { redirect, chefId } = this.state;
    if (redirect) {
      return (
        <Redirect to={{
          pathname: '/chef',
          state: { chefId },
        }}
        />
      );
    }
    return null;
  }

  render() {
    const {
      signup,
      username,
      password,
      name,
      email,
    } = this.state;
    const hideOrShow = signup ? 'text' : 'hidden';
    return (
      <Provider store={store}>
        <Fragment>
          {this.renderRedirect()}
          <Link to="/userauth">
            <button type="button">Login as a User</button>
          </Link>
          <form onSubmit={this.handleSubmit}>
            <div className="chef-login">
              <h3>Login as a Chef</h3>
              <button type="button" onClick={() => this.setLogin()}>Login</button>
              <button type="button" onClick={() => this.setSignup()}>Signup</button>
              <div>
                <label>Username: </label>
                {' '}
                <br />
                <input
                  name="username"
                  value={username}
                  type="text"
                  onChange={this.handleChange}
                />
              </div>
              <div>
                <label>Password: </label>
                <br />
                <input
                  name="password"
                  value={password}
                  type="password"
                  onChange={this.handleChange}
                />
              </div>
              <div style={{ visibility: signup ? 'visible' : 'hidden' }}>
                <label>Name: </label>
                <input
                  name="name"
                  value={name}
                  type={hideOrShow}
                  onChange={this.handleChange}
                />
              </div>
              <div style={{ visibility: signup ? 'visible' : 'hidden' }}>
                <label>Email: </label>
                <input
                  name="email"
                  value={email}
                  type={hideOrShow}
                  onChange={this.handleChange}
                />
              </div>
              <button type="submit">Submit</button>
            </div>
          </form>
          {/* <PostForm />
          <Posts /> */}
        </Fragment>
      </Provider>
    );
  }
}

export default ChefAuth;
