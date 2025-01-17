import {useSelector} from 'react-redux';
import {Navigate} from 'react-router-dom';
import PropTypes from 'prop-types';

const AdminRoute = ({children}) => {
    const {isAdmin, isAuthenticated} = useSelector((state) => state.auth);

    return isAuthenticated && isAdmin ? children : <Navigate to='/login' />
};

AdminRoute.propTypes = {
    children: PropTypes.node.isRequired, // Ensures the `children` prop is passed and is valid React nodes
};

export default AdminRoute