import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, removeToken, getRoleFromToken } from "../../utils/tokenUtils"
import loginUser from '../../services/authService'


function Login() {

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function  handleSubmit() {


    try{

    const response = await loginUser(email, password);
    //console.log("1. response:", response.data);

    const token = response.data.token
    //console.log("2. token:", token);

    saveToken(token)
   //console.log("3. token saved");

    const role = getRoleFromToken();
    //console.log("4. role:", role);

    if(role === 'ADMIN') navigate('/admin/dashboard')
    else navigate('/user/dashboard')

    }catch(err)
    {

         setError('Invalide emial or password')

    }

  }

  return (
    <div>
      <h1>DriveX Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br/>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br/>

      {error && <p>{error}</p>}

      <button onClick={handleSubmit}>Login</button>

    </div>
  )
}

export default Login