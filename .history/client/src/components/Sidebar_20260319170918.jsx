const Sidebar = ({ users, setSelected, notifications }) => {
  return (
    <div className="w-1/4 bg-gray-200 p-4">
      <h2 className="font-bold mb-3">Users</h2>

      {users.map((u) => {
        const hasNotification = notifications.some(
          (n) => n.from === u._id
        );

        return (
          <div
            key={u._id}
            className="p-2 bg-white mb-2 cursor-pointer flex justify-between"
            onClick={() => setSelected(u)}
          >
            <span>{u.username}</span>

            {hasNotification && (
              <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                !
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};