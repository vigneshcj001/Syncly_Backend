const express = require("express");
const portfolioRouter = express.Router();
const { userAuth } = require("../Middleware/auth");

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/portfolio/projectController");
const { createExperience, 
    getExperiences,
     updateExperience, 
     deleteExperience                                                                                                                                                                                                                                                                                                             
    } = require("../controllers/portfolio/experienceController");
  
    const {
      createEducation,
      getEducations,
      updateEducation,
      deleteEducation,
    } = require("../controllers/portfolio/educationController");
  


    const {
      createCertification,
      getCertifications,
      updateCertification,
      deleteCertification,
    } = require("../controllers/portfolio/certificationController");

    const {
      generatePortfolio,
      getPortfolioByUsername,
      updatePortfolioSettings,
      deletePortfolio,
    } = require("../controllers/portfolio/portfolioController");
     // Project Routes
  portfolioRouter.post("/projects", userAuth, createProject);
portfolioRouter.get("/projects/:slug", getProjects);
portfolioRouter.put("/projects/:id", userAuth, updateProject);
portfolioRouter.delete("/projects/:id", userAuth, deleteProject);

// Experience Routes
portfolioRouter.post("/experiences", userAuth, createExperience);
portfolioRouter.get("/experiences/:slug", getExperiences);
portfolioRouter.put("/experiences/:id", userAuth, updateExperience);
portfolioRouter.delete("/experiences/:id", userAuth, deleteExperience);


// Education Routes
portfolioRouter.post("/educations", userAuth, createEducation);
portfolioRouter.get("/educations/:slug", getEducations);
portfolioRouter.put("/educations/:id", userAuth, updateEducation);
portfolioRouter.delete("/educations/:id", userAuth, deleteEducation);


// Certification Routes
portfolioRouter.post("/certifications", userAuth, createCertification);
portfolioRouter.get("/certifications/:slug", getCertifications);
portfolioRouter.put("/certifications/:id", userAuth, updateCertification);
portfolioRouter.delete("/certifications/:id", userAuth, deleteCertification);


// Portfolio Routes
portfolioRouter.post("/portfolio", userAuth, generatePortfolio);
portfolioRouter.get("/portfolio/:slug", getPortfolioByUsername);
portfolioRouter.put("/portfolio/:id", userAuth, updatePortfolioSettings);
portfolioRouter.delete("/portfolio/:id", userAuth, deletePortfolio);
module.exports = portfolioRouter;
