export default function handler(req, res) {
  return res.status(200).json({
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_PORT_NUMBER: Number(process.env.MYSQL_PORT),
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE
  });
}
