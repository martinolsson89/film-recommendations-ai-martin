using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FilmRecomendations.Models.DTOs;

public sealed record LoginResponseDto
(
    string AccessToken,
    DateTime ExpiresAtUtc,
    string UserName
);
