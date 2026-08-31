import yaml from 'js-yaml';
import raw from './resume.yaml?raw';
import { resumeSchema, type Resume } from './schema';

export const resume: Resume = resumeSchema.parse(yaml.load(raw));
