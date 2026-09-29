const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, signToken, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    await audit(req, 'user.register', 'user', user._id, user.email, { role: user.role });
    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.active) return res.status(403).json({ error: 'Account disabled' });
    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  })
);

// admin: list users, change roles
router.get(
  '/users',
  auth,
  asyncHandler(async (req, res) => {
    const users = await User.find({ active: true }).select('name email role createdAt');
    res.json({ users });
  })
);

router.patch(
  '/users/:id/role',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can change roles' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('name email role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    await audit(req, 'user.role_change', 'user', user._id, user.email, { role: req.body.role });
    res.json({ user });
  })
);

module.exports = router;
