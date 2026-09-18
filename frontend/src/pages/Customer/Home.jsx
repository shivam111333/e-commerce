import { useState, useEffect } from "react";
import axios from 'axios';
import ProductCard from "../../component/ProductCard";

function Home() {
    const [products, setProducts] = useState([]); 
    const [loading,setLoading]=useState(false)
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchProduct = async () => {

            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3000/api/product');
                
                setProducts(response.data.data); 
            } catch (err) {
                setError(err.message);
            }
            finally{
                setLoading(false)
            }
        };
        fetchProduct();
    }, []);

   

    if (error) {
        return <h1>Error: {error}</h1>;
    }
    if(loading){
        return  <h1>Loading...</h1>
    }
         return (
        
<div className="mx-auto max-w-7xl px-6 py-8">

  

  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {products.map((product) => (
     <ProductCard key={product._id} product={product}/>
    ))}
  </div>

</div>


    );
}

export default Home;
