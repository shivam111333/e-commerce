import {useSelector,useDispatch} from 'react-redux';
import {useNavigate} from 'react-router-dom'
import logout from '../../redux/slices/authSlice';

function VendorDashboard()
{
     const dispatch=useDispatch()
     const navigate=useNavigate()
     const user=useSelector((state)=>state.auth.user);
     if(!user)
     {
       return  navigate('/');
     }
     const handlelogout=()=>{
        dispatch(logout());
        navigate('/');
        
     }
    return (
        <>
           <h1>{user.name}</h1>
           <h1>{user.role}</h1>
           
            <button onClick={handlelogout}></button>
                     </>
    )

}
export default VendorDashboard;