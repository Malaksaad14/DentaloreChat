namespace DentaloreChat.Domain.Entities;
public class User
{
    public Guid? Id { get; set; } = Guid.NewGuid();
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }

    public Guid? ClinicId { get; set; }
    public Clinic? Clinic { get; set; }
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
}