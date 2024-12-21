import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const todos = await prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  } else if (req.method === "POST") {
    try {
      const todo = await prisma.todo.create({
        data: {
          text: req.body.text,
          status: req.body.status,
        },
      });
      res.status(201).json(todo);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  } else if (req.method === "PUT") {
    try {
      const todo = await prisma.todo.update({
        where: { id: req.body.id },
        data: {
          text: req.body.text,
          status: req.body.status,
        },
      });
      res.status(200).json(todo);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.todo.delete({
        where: { id: req.query.id as string },
      });
      res.status(200).json({ message: "Todo deleted" });
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  }
}
