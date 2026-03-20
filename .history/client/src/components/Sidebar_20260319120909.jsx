const Sidebar = ({ users, setSelected }) => {
  return (
    <div className="w-1/4 bg-gray-200 p-4">
      <h2 className="font-bold mb-3">Users</h2>

      {users.map((u) => (
        <div
          key={u._id}
          className="p-2 bg-white mb-2 cursor-pointer"
          onClick={() => setSelected(u)}
        >
          {u.username}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;