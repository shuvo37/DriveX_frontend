import { getRoleFromToken, getToken, isTokenExpired } from "../../../utils/tokenUtils"
import { Navigate } from "react-router-dom";

function ProtectedRoute({allowAble , children})
{


     const token = getToken()

     if(!token || isTokenExpired())
     {

         return <Navigate  to = "/"/>
     }


    const role = getRoleFromToken();

    if(!role || !allowAble.includes(role))
    {
          return <Navigate to = "/login"/>
    }

    return children

}

export default ProtectedRoute