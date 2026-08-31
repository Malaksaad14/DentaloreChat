using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentaloreChat.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAuthentication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1010101-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 10, 18, 27, 524, DateTimeKind.Utc).AddTicks(4821));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1111111-1111-1111-1111-111111111111"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 10, 10, 27, 524, DateTimeKind.Utc).AddTicks(4768));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2010201-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 10, 10, 27, 524, DateTimeKind.Utc).AddTicks(4827));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 10, 15, 27, 524, DateTimeKind.Utc).AddTicks(4798));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b7777777-7777-7777-7777-777777777777"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 9, 55, 27, 524, DateTimeKind.Utc).AddTicks(4810));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b8888888-8888-8888-8888-888888888888"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 31, 10, 0, 27, 524, DateTimeKind.Utc).AddTicks(4815));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1111111-1111-1111-1111-111111111111"),
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "hana@clinic.com", "$2a$11$PinGI0C0inHXuOSlxojh/eghTbvVRMbJL3cHP4L5t7.pGGmWEVRty" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a2222222-2222-2222-2222-222222222222"),
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "ahmed@clinic.com", "$2a$11$Vx3Pn3/2GtEpmoW0p4Ab3.k6DagbYEJUF/ZhSAG2PCXG5ixYM64AK" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a3333333-3333-3333-3333-333333333333"),
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "sara@clinic.com", "$2a$11$SNpH21GAZAmYWW3YM.wYYOrxBdkGni6zaaOkj288EwNvUaU5khQWK" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a4444444-4444-4444-4444-444444444444"),
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "omar@clinic.com", "$2a$11$0BQW0LsGFVGQU3YhDuzQSOB/cd5aJbRFjmrUXN1j1dbIf/xTm0VvK" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1010101-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 27, 45, 69, DateTimeKind.Utc).AddTicks(7914));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1111111-1111-1111-1111-111111111111"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 19, 45, 69, DateTimeKind.Utc).AddTicks(7896));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2010201-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 19, 45, 69, DateTimeKind.Utc).AddTicks(7916));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 24, 45, 69, DateTimeKind.Utc).AddTicks(7907));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b7777777-7777-7777-7777-777777777777"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 4, 45, 69, DateTimeKind.Utc).AddTicks(7909));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b8888888-8888-8888-8888-888888888888"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 29, 13, 9, 45, 69, DateTimeKind.Utc).AddTicks(7911));
        }
    }
}
