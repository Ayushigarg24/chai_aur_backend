import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar", // this name should be same on frontend and backend 
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        },
    ]),
    registerUser
)

export default router