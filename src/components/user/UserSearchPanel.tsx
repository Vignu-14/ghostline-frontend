import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as userService from "../../services/userService";
import type { UserSearchResult } from "../../types/user";
import { getErrorMessage } from "../../utils/errorHandler";
import { Avatar } from "../common/Avatar";

export function UserSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 1) {
      setResults([]);
      setError("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutID = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await userService.searchUsers(trimmedQuery, 10);
          setResults(response.users);
          setError("");
        } catch (searchError) {
          setError(getErrorMessage(searchError, "Unable to search users."));
        } finally {
          setIsSearching(false);
        }
      })();
    }, 180);

    return () => {
      window.clearTimeout(timeoutID);
    };
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p className="text-sm text-muted" style={{ marginBottom: '14px' }}>
        Find people on Ghostline and check out their profiles.
      </p>

      <div className="form-group" style={{ marginBottom: '12px' }}>
        <input
          className="input-base"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by username..."
          value={query}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {isSearching ? <p className="text-muted text-sm">Searching...</p> : null}

      {query.trim().length >= 1 && !isSearching && results.length === 0 ? (
        <p className="text-muted text-sm">No matching users found.</p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {results.map((user) => (
          <Link className="user-list-item" key={user.id} to={`/u/${user.username}`}>
            <Avatar alt={user.username} src={user.profile_picture_url} />
            <div className="user-list-item__info">
              <span className="font-medium text-sm">@{user.username}</span>
              <span className="text-faint text-xs">View profile</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
