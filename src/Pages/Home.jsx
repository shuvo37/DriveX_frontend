
import { useNavigate } from "react-router-dom"


function Home()
{



    const navigate = useNavigate();


    function handleLogin()
    {


         navigate("/login")


    }



    
    return(

        <>
        
           <h1> WELCOME TO HOME</h1>

           <button  onClick={handleLogin}> Login </button><br/>

           <a href="http://localhost:8080/oauth2/authorization/google">
           Login with Google
           </a>
    
        </>


    )



}


export default Home