import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // 'todo', 'in_progress', 'done'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high'
  dueDate: bigint('due_date', { mode: 'number' }),
  notifiedUpcoming: boolean('notified_upcoming').default(false),
  notifiedOverdue: boolean('notified_overdue').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  author: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));
