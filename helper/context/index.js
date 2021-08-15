
const jwt=require('jsonwebtoken')

module.exports.verifyUser=async (req)=>{
        try {
          req.user=null  
          const bearerHeader = req.headers.authorization;
          if (bearerHeader) {
            const token = bearerHeader.split(' ')[1];
            const payload = jwt.verify(token, process.env.SECRET);
            req.user = payload.id;
          }
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
