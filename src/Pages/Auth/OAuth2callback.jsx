
import { useEffect } from "react";
import { useNavigate , useSearchParams } from "react-router-dom";
import { getRoleFromToken, saveToken } from "../../utils/tokenUtils";



function OAuth2callback()
{

 const [SearchParams] = useSearchParams()

 const Navigate = useNavigate()

 useEffect( () =>{
    
     const token = SearchParams.get('token')
     
     if(!token)
     {

         Navigate("/home")

     }

     saveToken(token)

     const role = getRoleFromToken()

     Navigate(role == 'ADMIN' ? '/home-admin' : '/user-home')
    
    
}, [])
   

  return <p> Logging you in</p>

}

export default OAuth2callback