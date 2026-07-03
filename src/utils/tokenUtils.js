import { data } from "react-router-dom"



export function saveToken(token)
{

    localStorage.setItem('token' , token)

}



export function getToken()
{


  return localStorage.getItem('token')

}


export function removeToken()
{

   localStorage.removeItem('token')

}


export function getRoleFromToken()
{
     const token = getToken()

     //console.log(token)

     if(!token){return null}

     const payload = token.split('.')[1]

     const decode = JSON.parse(atob(payload))

    return decode.role


}


export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;

  const payload = token.split('.')[1]
  const decode = JSON.parse(atob(payload))
  const exp = decode.exp 

  return Date.now() >= exp * 1000
}
