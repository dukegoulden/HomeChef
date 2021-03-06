import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getChefList } from '../redux/actions/chefActions';
import MapContainer from './MapContainer';

class UserHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    };
    this.getUserDetails = this.getUserDetails.bind(this);
  }

  componentWillMount() {
    this.props.getChefList();
    if (!this.state.user.id) {
      this.getUserDetails(this.props.location.state.username);
    }
  }


  getUserDetails(username) {
    axios.get(`/api/user/accountInfo?username=${username}`).then((res) => {
      this.setState({
        user: res.data,
      });
    });
  }

  renderChefList() {
    const { user } = this.state;
    const { chefs } = this.props;
    const { latitude, longitude } = this.props.location.state;
    return chefs.map(chef => (
      <table>
        <tbody>
          <tr key={chef.id}>
            <td width="80%">
              <div>
                {chef.name}
                <br />
                {chef.description}
                <br />
                {`${chef.streetAddress}, ${chef.city}, ${chef.stateName} ${chef.zip}`}
              </div>
            </td>
            <td width="20%">
              <Link
                to={{
                  pathname: '/user/chefdetails',
                  state: {
                    user, chef, latitude, longitude,
                  },
                }}
              >
                <button type="button">Select</button>
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    ));
  }

  render() {
    const { user } = this.state;
    const { chefs } = this.props;
    const { latitude, longitude } = this.props.location.state;
    return (
      <div className="grid-subcontainer">
        <div className="grid-wide">
          <h2>{`Welcome ${user.username}`}</h2>
          <Link to={{
            pathname: '/user/transactions',
            state: { user, latitude, longitude },
          }}
          >
            <button type="button">My Orders</button>
          </Link>
          <h3>What's Cooking?</h3>
          {this.renderChefList()}
          <br />
          <br />
          <MapContainer
            latitude={latitude}
            longitude={longitude}
            chefs={chefs}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  chefs: state.chefs.chefsAvailable,
});
export default connect(
  mapStateToProps,
  {
    getChefList,
  },
)(UserHome);
