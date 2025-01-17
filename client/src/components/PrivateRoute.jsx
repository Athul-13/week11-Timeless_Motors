import {useSelector} from 'react-redux';
import {Navigate, useLocation} from 'react-router-dom';
import PropTypes from 'prop-types';

const PrivateRoute = ({children}) => {
    const {isAuthenticated, token} = useSelector((state) => state.auth);
    const location = useLocation();

    console.log('PrivateRoute state:', { 
        isAuthenticated, 
        hasToken: !!token 
    });

    if (!isAuthenticated || !token) {
        console.log('Redirecting to login: Not authenticated');
        return <Navigate 
            to="/login" 
            replace={true} 
            state={{ from: location.pathname }}
        />;
    }

    return children;
};

PrivateRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PrivateRoute;