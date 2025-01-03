import axios from 'axios'; //para realizar solicitudes HTTP
import { Joke } from '../models/Joke.js'; //importa el modelo para interactuar con la BD

//Función para obtener un chiste basado en un parámetro de consulta
export const getJoke = async (req, res) => {
   const { param } = req.query; //extrae el parametro desde la solicitud

    if (!param) {
        return res.status(400).json({ error: 'Parámetro no válido' });
    }

    try {
        if (param === 'Chuck') {
            //Obtener un chiste de Chuck Norris
            const response = await axios.get('https://api.chucknorris.io/jokes/random');
            return res.status(200).json({ joke: response.data.value });
        } else if (param === 'Dad') {
            //Obtener un Dad Joke
            const response = await axios.get('https://icanhazdadjoke.com/', {
                headers: { Accept: 'application/json' }
            });
            return res.status(200).json({ joke: response.data.joke });  
        } else if (param === 'Propio') {
            //Obtener un chiste interno de la base de datos
            const jokes = await Joke.find(); //Busca todos los chistes en la base de datos

            //Si no hay chistes en la base de datos, retornar un mensaje
            if (jokes.length === 0) {
                return res.status(200).json({ message: 'Aun no hay chistes, cree uno!' });
            }
            //Si hay chistes en la base de datos, retornar un chiste aleatorio
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            return res.status(200).json({ joke: randomJoke.text }); 
        } else {
            return res.status(400).json({ error: 'Parámetro no válido' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener el chiste' });
    }      
};

//Funcion para crear un nuevo chiste
export const createJoke = async (req, res) => {
    const { text, author, rating, category } = req.body; //Extrae los datos del cuerpo de la solicitud

    if (!text) {
        return res.status(400).json({ error: 'El campo "texto" es requerido.' });
    }
    if (rating === undefined || rating < 1 || rating > 10) {
        return res.status(400).json({ error: 'El campo "puntaje" es requerido y debe estar entre 1 y 10.' });
    }
    if (!category) {
        return res.status(400).json({ error: 'El campo "categoría" es requerido.' });
    }

    const validCategories = ['Dad joke', 'Humor Negro', 'Chistoso', 'Malo'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Categoría no válida. Las categorías permitidas son: Dad joke, Humor Negro, Chistoso o Malo.' });
    }

    try {
        const newJoke = new Joke({
            text,
            author: author || "Se perdió en el Ávila como Led",  //Asigna un autor por defecto si no se proporciona uno
            rating,
            category,
        });
        //Guarda el chiste en la base de datos
        const savedJoke = await newJoke.save();

        //Retorna el ID del chiste creado
        return res.status(201).json({ id: savedJoke._id });
    } catch (error) {
        return res.status(500).json({ message: 'Error al guardar el chiste en la base de datos', error: error.message });
    }
};

//Funcion para actualizar un chiste
export const updateJoke = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del chiste desde los parámetros de la URL
    const { text, author, rating, category } = req.body; // Obtiene los nuevos datos del cuerpo de la solicitud

    try {
        //Validar que el chiste exista
        const joke = await Joke.findById(id);
        if (!joke) {
            return res.status(404).json({ error: 'Chiste no encontrado por el ID dado.' });
        }

        //Actualizar los campos solo si se proporcionan
        if (text !== undefined) {
            joke.text = text;
        }
        if (author !== undefined) {
            joke.author = author;
        }
        if (rating !== undefined) {
            if (rating < 1 || rating > 10) {
                return res.status(400).json({ error: 'El campo "puntaje" debe estar entre 1 y 10.' });
            }
            joke.rating = rating;
        }
        if (category !== undefined) {
            const validCategories = ['Dad joke', 'Humor Negro', 'Chistoso', 'Malo'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ error: 'Categoría no válida. Las categorías permitidas son: Dad joke, Humor Negro, Chistoso o Malo.' });
            }
            joke.category = category;
        }

        //Guarda los cambios en la base de datos
        const updatedJoke = await joke.save();

        //Retorna el chiste actualizado
        return res.status(200).json({
            message: 'Chiste actualizado exitosamente.',
            updatedJoke 
        });
    } catch (error) {
        console.error('Error al actualizar el chiste:', error);
        return res.status(500).json({ message: 'Error al actualizar el chiste en la base de datos', error: error.message });
    }
};

export const deleteJokeById = async(req,res)=>{

    const { id } = req.params;
    //Se verifica si el ID correspondiente es valido
    if (!id) {
        return res.status(400).json({ error: 'Id no Válido' });
    }
    try{
        // Se intenta eliminar el chiste por el ID proporcionado por el usuario
        const deletedJoke = await Joke.findByIdAndDelete(id);

        if (!deletedJoke) {
            //Se envia el mensaje en caso que el chiste no haya sido encontrado para ser eliminado
            return res.status(400).json({ error: 'Chiste no encontrado' });
        }

        //Se muestra el mensaje en caso que se haya podido eliminar el Chiste
        return res.status(200).json({ message: 'Chiste eliminado con éxito', joke: deletedJoke });

    }catch(error){
        //Fallo inesperado al no poder eliminar el chiste
        console.error(error);
        return res.status(500).json({ error: 'Error al eliminar el chiste' });

    }
};

export const getJokeById =   async (req,res)=>{

    const { id } = req.params;
    //Se verifica si el ID correspondiente es valido
    if (!id) {
        return res.status(400).json({ error: 'Id no Válido' });
    }


    try {
        //Se prueba encontrar el chiste por el ID proporcionado por el usuario
        const joke = await Joke.findById(id);

        if (!joke) {
            //Se envia un mensaje de error en caso que no se consiga el chiste proporcionado por el usuario
            return res.status(400).json({ error: 'Chiste no encontrado' });
        }

        //Se muestra el chiste seleccionado por el ID proporcionado por el usuario
        return res.status(200).json({ joke: joke.text }); 

    } catch (error) {
        //Mensaje de error inesperado al no poder conseguir el id dado por el usuario
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener el chiste' });
    }
};