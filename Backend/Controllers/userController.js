import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js'
import Follow from '../Models/Follow.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const __dirname = path.resolve();



