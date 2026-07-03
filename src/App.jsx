
import { BrowserRouter , Routes , Route } from "react-router-dom"
import Home from "./Pages/Home"
import Login from "./Pages/Auth/Login"
import AdminDashboard from "./Pages/admin/AdminDashboard"
import UserDashboard from "./Pages/user/UserDashboard"
import Unauthorized from "./Unauthorized"
import ProtectedRoute from "./Pages/Components/ProtectedRoute"
import OAuth2callback from "./Pages/Auth/OAuth2callback"
import CompleteProfile from "./Pages/Auth/CompleteProfile"




function App() {
  return (
    <div>
    
         <BrowserRouter>
         
          <Routes>

            <Route path = "/"  element = {<Home/>}/>
          
            <Route path = "/login"  element = {<Login/>}/>

            <Route path = "/user/dashboard"  element = {
              
              <ProtectedRoute allowAble = {"USER"}>
              
                 <UserDashboard/>
              
              </ProtectedRoute>
                 
              
              }/>


            <Route path = "/admin/dashboard" element = {
              <ProtectedRoute  allowAble = {"ADMIN"}>
        
                  <AdminDashboard/>
              
              </ProtectedRoute>
             
              
              }/>

              <Route path = "/unauthorized"   element = {<Unauthorized/>}/>

              <Route path="/oauth2/callback" element={<OAuth2callback/>} />

              <Route path="/complete-profile" element={<CompleteProfile />} />
          
          </Routes>
         
         
         </BrowserRouter>
    
    
    </div>
  )
}

export default App