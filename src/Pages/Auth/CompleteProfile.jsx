
import { useState , useEffect } from "react"

import axios  from "axios"

import { useNavigate , useSearchParams } from "react-router-dom"
import { saveToken } from "../../utils/tokenUtils"


function CompleteProfile()
{


    const [phone , setPhone] = useState('')

    const [city , setCity] = useState('')

    const [error, setError] = useState('')

    const [token ,setToken] = useState('') 

    const Navigate = useNavigate()

    const [SearchParams] = useSearchParams()


      useEffect(()=>{

         const t = SearchParams.get('token')

         if(!t)
         {
            Navigate('/login')

            return
         }

         setToken(t)

         saveToken(t)

      } , [])
     



      async function handleSubmit()
      {


          try{


              await axios.post('http://localhost:8080/api/auth/complete-profile', 

               {phoneNumber:phone , 
                city : city} , {headers:{Authorization:`Bearer ${token}`}}

              )

            Navigate('/user/dashboard')


          }
          catch(err)
          {

                console.log(err.response?.status)
                console.log(err.response?.data)

              setError('failed to save try again')
                   
          }
           


      }






     return (

     
        <div>

            <h1>Complete Your Profile</h1>

            <input
            
                placeholder="phone Number"

                value = {phone}

                onChange={e => setPhone(e.target.value)}
            
            />

            <br/>

            <select value={city} onChange={e => setCity(e.target.value)}>


                <option value = "">select city</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>


            </select>

            <br/>

            {error && <p> {error}</p>}
        
            <button onClick={handleSubmit}> Save and Continue</button>

        
        
        </div>







     )





}


export default CompleteProfile