'user strict'

var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var jwt = require('../services/jwt');

function pruebas(req, res){
	res.status(200).send({
		message: 'Probando una accion del controlador de usuarios'
	});
};

function saveUser(req, res){
	var user = new User();

	var params = req.body;
	var email = params.email;

	console.log(params);

	user.name = params.name;
	user.surname = params.surname;
	user.email = params.email;
	user.role = 'ROLE_USER';
	user.image = 'null';

	User.findOne({email: email.toLowerCase()}, (err, userEmail) => {
		if (err) {
			res.status(500).send({message: 'Error en la peticion'});
		} else {
			if (userEmail) {
				res.status(404).send({message: 'Ya existe un usuario con ese email'});
			} else {
				if (params.password) {
					//encript password
					bcrypt.hash(params.password, null, null, function(err, hash){
						user.password = hash;
						if (user.name != null && user.surname != null && user.email != null){
							// guarda el usuario
							user.save((err, userStored) => {
								if (err) {
									res.status(500).send({message: 'Rellena los campos'});
								}else{
									if (!userStored) {
										res.status(404).send({message: 'No se ha registrado el usuario'});
									}else{
										res.status(200).send({user: userStored});
									}		
								}
							});
						}else{
							res.status(200).send({message: 'Rellena los campos'});
						}
					});
				}else{
					res.status(200).send({message: 'Introduce la contraseña'});
				}
			}
		}
	})
}

function loginUser(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	User.findOne({email: email.toLowerCase()}, (err, user) => {
		if (err) {
			res.status(500).send({message: 'Error en la peticion'});
		}else{
			if (!user) {
				res.status(404).send({message: 'El usuario no existe'});
			}else{
				//Comprobar contraseña
				bcrypt.compare(password,user.password, function(err, check){
					if (check) {						
						//Devolver los datos del usuario logueado						
						if (params.gethash) {
							//Devolver un token de jwt
							res.status(200).send({
								token: jwt.createToken(user)
							});							
						}else{
							res.status(200).send({user});
						}
					}else{
						res.status(404).send({message: 'El usuario no ha podido loguearse'});
					}
				});
			}
		}
	});
};

function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;

	if (userId != req.user.sub) {
		return res.status(500).send({message: 'No tienes permiso para actualizar este usuario'});
	}

	User.findByIdAndUpdate(userId, update, function(err, userUpdated){
		if (err) {
			res.status(500).send({message: 'Error al actualizar el usuario'});
		}else{
			if (!userUpdated) {
				res.status(404).send({message: 'No se ha podido actualizar el usuario'});
			}else{
				res.status(200).send({user: userUpdated});
			}
		}
	});
}

function uploadImage(req, res){
	var userId = req.params.id;
	var file_name = 'No subido';

	if (req.files) {
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_name = file_split[2];

		var extension_split = file_name.split('\.');
		var file_extension = extension_split[1];

		if (file_extension == 'png' || file_extension == 'jpg') {
			User.findByIdAndUpdate(userId, {image: file_name}, (err, userUpdated) => {
				if (!userUpdated) {
					res.status(404).send({message: 'No se ha podido actualizar la imagen'});
				}else{
					res.status(200).send({image: file_name, user: userUpdated});
				}
			});
		}else{
			res.status(200).send({message: 'Extensión del archivo no válida'});
		}

	}else{
		res.status(200).send({message: 'No ha subido ninguna imagen'});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.imageFile;
	var path_file = './uploads/users/'+imageFile;
	fs.exists(path_file, function (exists) {
		if (exists) {
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen'});
		}
	});
}

module.exports = {
	pruebas,
	saveUser,
	loginUser,
	updateUser,
	uploadImage,
	getImageFile
};