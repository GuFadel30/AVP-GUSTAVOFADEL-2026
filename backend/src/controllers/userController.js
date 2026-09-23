export async function getProfile(req, res) {
  return res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
}
