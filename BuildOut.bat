# News-Net-API (.NET 8)
dotnet build .\News-Net-API\News-Net-API.csproj

# sb-admin-react
npm --prefix .\sb-admin-react install
npm --prefix .\sb-admin-react run build

dotnet publish .\News-Net-API\News-Net-API.csproj -c Release -o .\News-Net-API\publish

