import { RequestHandler } from 'express';
import { ZodType } from 'zod';

type Schemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

/**
 * Validates request parts with zod and stores the parsed (coerced) values
 * on res.locals so controllers work with typed data. ZodErrors are passed
 * to the central error handler.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    res.locals.body = schemas.body ? schemas.body.parse(req.body) : req.body;
    res.locals.params = schemas.params ? schemas.params.parse(req.params) : req.params;
    res.locals.query = schemas.query ? schemas.query.parse(req.query) : req.query;
    next();
  };
