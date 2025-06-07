const express = require('express');
const prisma = require('../scripts/prisma/prismaConfig');
const handleError = require('../utils/exceptions');

const tagRoutes = express.Router();

tagRoutes.post('/tags', async (request, response) => {
  try {
    const { name, color, todoId } = request.body;

    if (todoId) {
      const todo = await prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) return handleError(response, 404, 'Todo not found');
    }

    const tag = await prisma.tag.create({
      data: { name, color }
    });

    if (todoId) {
      const tagTodo = await prisma.tagTodo.create({
        data: {
          todo: { connect: { id: todoId } },
          tag: { connect: { id: tag.id } }
        }
      });

      return response.status(201).json({ tag, tagTodo });
    } else {
      return response.status(201).json({ tag });
    }
  } catch (error) {
    console.error(error);
    return handleError(response, 500, 'Internal Server Error');
  }
});

tagRoutes.get('/tags', async (request, response) => {
  try {
    const { todoId } = request.query;

    const tags = todoId
      ? await prisma.tag.findMany({
          where: { tagTodo: { some: { todoId: parseInt(todoId) } } }
        })
      : await prisma.tag.findMany();

    return response.status(200).json(tags);
  } catch (error) {
    console.error(error);
    return handleError(response, 500, 'Internal Server Error');
  }
});

tagRoutes.get('/tags/:todoId', async (request, response) => {
  try {
    const { todoId } = request.params;
    if (!todoId) return handleError(response, 400, 'todoId is required');

    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(todoId) }
    });
    if (!todo) return handleError(response, 404, 'Todo not found');

    const tags = await prisma.tag.findMany({
      where: { tagTodo: { some: { todoId: parseInt(todoId) } } }
    });

    return response.status(200).json(tags);
  } catch (error) {
    console.error(error);
    return handleError(response, 500, 'Internal Server Error');
  }
});

tagRoutes.put('/tags', async (request, response) => {
  try {
    let newTagTodo = null;

    const { id, name, color, todoId } = request.body;

    if (!id) return handleError(response, 400, 'Id is required');

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return handleError(response, 404, 'Tag not found');

    if (todoId) {
      const todo = await prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) return handleError(response, 404, 'Todo not exists');

      const tagTodo = await prisma.tagTodo.findFirst({
        where: { todoId, tagId: tag.id }
      });

      if (!tagTodo) {
        newTagTodo = await prisma.tagTodo.create({
          data: { todo: { connect: { id: todoId } }, tag: { connect: { id } } }
        });
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: { name, color: color || tag.color }
    });

    if (newTagTodo)
      return response.status(200).json({ updatedTag, newTagTodo });
    return response.status(200).json(updatedTag);
  } catch (error) {
    console.error(error);
    return handleError(response, 500, 'Internal Server Error');
  }
});

tagRoutes.delete('/tags/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const intId = parseInt(id);

    if (!intId) return handleError(response, 400, 'Id is required');

    const tag = await prisma.tag.findUnique({ where: { id: intId } });
    if (!tag) return handleError(response, 404, 'Tag not exists');

    await prisma.tagTodo.deleteMany({ where: { tagId: intId } });
    await prisma.tag.delete({ where: { id: intId } });

    return response.status(200).json({ success: 'Tag deleted' });
  } catch (error) {
    console.error(error);
    return handleError(response, 500, 'Internal Server Error');
  }
});

module.exports = tagRoutes;
