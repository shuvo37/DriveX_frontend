import { useState } from "react";
import "./CSS/AddCompany.css";
import axios from "axios";

function AddCompany() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");        
  const [loading, setLoading] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await axios.post("http://localhost:8080/api/company", {
      companyName:        formData.name,
      companyEmail:       formData.email,
      companyPhoneNumber: formData.phone,
      companyCity:        formData.city,
      companyAddress:     formData.address,
    });

    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", address: "", city: "" });
    setTimeout(() => setSubmitted(false), 3000);

  } catch (err) {
    if (err.response) {
      // server responded with a non-2xx status
      setError(err.response.data); // or err.response.data.message if backend sends JSON
    } else {
      // no response at all (server down, network error)
      setError("Server is not running. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="page">
      <div className="form-card">
        <div className="form-header">
          <div className="form-icon">🏢</div>
          <div>
            <h2>Add New Company</h2>
            <p>Fill in the details to register a new company</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">

          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. FastRent Ltd."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="company@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. New York"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="reset" className="btn-cancel"
              onClick={() => setFormData({ name:"", email:"", phone:"", address:"", city:""})}
            >
              Clear
            </button>
            <button type="submit" className="btn-submit">
              Add Company
            </button>
          </div>

          {submitted && (
            <div className="success-msg">
              ✅ Company added successfully!
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

export default AddCompany;