//higher order function as it take allowedRole and return a function
const authorization = (allowedRoles) => {
  return (req, res, next) => {

    //first check whether the user exist or not 
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User Not found",
      });
    }
    //check for authorization 
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this resource  ",
      });
    }
    next();
  };
};

export default authorization;