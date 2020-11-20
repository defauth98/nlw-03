import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup';

import Orphanages from '../models/Orphanages';

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanages);

    const orphanages = await orphanagesRepository.find({
      relations: ['images'],
      where: {
        accepted: true,
      },
    });

    return response.json(orphanageView.renderMany(orphanages));
  },

  async indexPending(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanages);

    const orphanages = await orphanagesRepository.find({
      relations: ['images'],
      where: {
        accepted: false,
      },
    });

    return response.json(orphanageView.renderMany(orphanages));
  },

  async acceptOrphanage(request: Request, response: Response) {
    const { id } = request.params;

    try {
      const orphanagesRepository = getRepository(Orphanages);

      const orphanage = await orphanagesRepository.findOneOrFail(id, {
        relations: ['images'],
      });

      if (orphanage) {
        orphanage.accepted = true;
      }

      orphanage && (await orphanagesRepository.save(orphanage));

      response.status(209).send();
    } catch (error) {
      response
        .status(400)
        .json({ message: 'Não foi possível aceitar o orfanato' });
    }
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const orphanagesRepository = getRepository(Orphanages);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images'],
    });

    return response.json(orphanageView.render(orphanage));
  },

  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    const orphanagesRepository = getRepository(Orphanages);

    const requestImages = request.files as Express.Multer.File[];
    const images = requestImages.map((image) => {
      return { path: image.filename };
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === true,
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required(),
        })
      ).required(),
    });

    await schema.validate(data, {
      abortEarly: false,
    });

    const orphanage = orphanagesRepository.create(data);

    await orphanagesRepository.save(orphanage);

    return response.status(201).json(orphanage);
  },

  async delete(request: Request, response: Response) {
    const { id } = request.params;

    const orphanagesRepository = getRepository(Orphanages);

    try {
      await orphanagesRepository.delete(id);

      response.json({ message: 'success' });
    } catch (error) {
      console.log(error);

      response.json({ error: 'Erro ao tentar deletar um orfanato' });
    }
  },

  async update(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    const { id } = request.params;

    try {
      const orphanagesRepository = getRepository(Orphanages);

      const requestImages = request.files as Express.Multer.File[];

      const images = requestImages.map((image) => {
        return { path: image.filename };
      });

      const data = {
        name,
        latitude,
        longitude,
        about,
        instructions,
        opening_hours,
        open_on_weekends: open_on_weekends === true,
        images,
      };

      const schema = Yup.object().shape({
        name: Yup.string().required(),
        latitude: Yup.number().required(),
        longitude: Yup.number().required(),
        about: Yup.string().required().max(300),
        instructions: Yup.string().required(),
        opening_hours: Yup.string().required(),
        open_on_weekends: Yup.boolean().required(),
        images: Yup.array(
          Yup.object().shape({
            path: Yup.string().required(),
          })
        ).required(),
      });

      await schema.validate(data, {
        abortEarly: false,
      });

      const orphanage = await orphanagesRepository.findOneOrFail(id, {
        relations: ['images'],
      });

      if (orphanage) {
        orphanage.name = data.name;
        orphanage.latitude = data.latitude;
        orphanage.longitude = data.longitude;
        orphanage.about = data.about;
        orphanage.instructions = data.instructions;
        orphanage.open_on_weekends = data.open_on_weekends;
        orphanage.opening_hours = data.opening_hours;

        orphanage.images.map((image, index) => {
          image.path = data.images[index].path;
        });
      }

      orphanage && (await orphanagesRepository.save(orphanage));

      response.json({ orphanage });
    } catch (error) {
      console.log(error);

      response.json({ message: 'Erro ao tentar dar update no orfanato' });
    }
  },
};
