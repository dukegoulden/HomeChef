import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

class ViewChefSchedule extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      schedule: [],
    };
    this.getSchedule = this.getSchedule.bind(this);
  }

  componentDidMount() {
    const { chef } = this.props;
    this.getSchedule(chef);
  }

  getSchedule(chef) {
    axios
      .get('/api/chef/schedule', { params: { id: chef.id } })
      .then((data) => {
        let sched = data.data.filter((event) => {
          const date = new Date(event.date.split('-').join(','));
          return date >= new Date();
        });
        sched = sched.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.setState({ schedule: sched });
      })
      .catch(err => console.log(err));
  }

  render() {
    const { schedule } = this.state;
    const {
      user, chef, latitude, longitude,
    } = this.props;
    return (
      <table>
        <tbody>
          <tr>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Menu Items</th>
          </tr>
          {schedule.map(event => (
            <tr>
              <td>{moment(event.date).format('ddd MMM. DD, YYYY')}</td>
              <td>{moment(event.startTime, 'HH:mm').format('h:mm a')}</td>
              <td>{moment(event.endTime, 'HH:mm').format('h:mm a')}</td>
              <td>
                <table>
                  <tbody>
                    <tr>
                      <th className="sub-table">Dish</th>
                      <th className="sub-table">Price</th>
                      <th className="sub-table">Quantity</th>
                    </tr>
                    {event.menuItems.map(item => (
                      <tr>
                        <td className="sub-table">{item.name}</td>
                        <td className="sub-table">
                          <span>$</span>
                          {(item.price).toFixed(2)}
                        </td>
                        <td className="sub-table">{item.quantity - item.reservations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td>
                <Link
                  to={{
                    pathname: '/user/chefschedule/reservation',
                    state: {
                      event, user, chef, userId: user.id, latitude, longitude,
                    },
                  }}
                >
                  <button type="button">Make Reservation</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export default ViewChefSchedule;
