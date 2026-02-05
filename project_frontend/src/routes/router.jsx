import React from 'react';
import { Routes,Route} from "react-router-dom";
import Appone from '../App';
import FormRecords from '../pages/formrecords';
import { Form } from 'react-bootstrap';
import UploadImage from '../pages/UploadImage';
import Login from '../pages/Login';
const AppRoutes =() =>{
    return(
        <Routes>
        <Route path='/' element={<Appone/>}/>
        <Route path='/records' element={<FormRecords/>}/>
        <Route path='/upload' element={<UploadImage/>}/>
        <Route path='/login' element={<Login/>} /> 
    </Routes>

    );

};

export default AppRoutes;